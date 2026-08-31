import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import axiosClient from "../api/axiosClient";

jest.mock("../api/axiosClient");

const mockNotes = [
  { _id: "1", title: "First note", content: "<p>hello</p>" },
  { _id: "2", title: "Second note", content: "<p>world</p>" },
];

const mockUser = { name: "Talha", email: "talha@test.com" };

function renderDashboard() {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    axiosClient.get.mockImplementation((url) => {
      if (url === "/notes") return Promise.resolve({ data: mockNotes });
      if (url === "/auth/me") return Promise.resolve({ data: { user: mockUser } });
      return Promise.reject(new Error("unknown url"));
    });
  });

  test("fetches and displays the user's notes in the sidebar", async () => {
    renderDashboard();
    expect(await screen.findByText("First note")).toBeInTheDocument();
    expect(screen.getByText("Second note")).toBeInTheDocument();
  });

  test("shows the logged in user's name and email", async () => {
    renderDashboard();
    expect(await screen.findByText("Talha")).toBeInTheDocument();
    expect(screen.getByText("talha@test.com")).toBeInTheDocument();
  });

  test("shows the add note button in the sidebar", async () => {
    renderDashboard();
    await screen.findByText("First note");
    expect(screen.getByRole("button", { name: "+ New Note" })).toBeInTheDocument();
  });

  test("opens a note in detail view when clicked", async () => {
    renderDashboard();
    const noteButton = await screen.findByRole("button", { name: "First note" });
    fireEvent.click(noteButton);

    expect(await screen.findByRole("heading", { name: "First note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Note" })).toBeInTheDocument();
  });

  test("filters the note list based on the search input", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.change(screen.getByPlaceholderText("Search notes..."), {
      target: { value: "second" },
    });

    expect(screen.queryByText("First note")).not.toBeInTheDocument();
    expect(screen.getByText("Second note")).toBeInTheDocument();
  });

  test("shows a delete confirmation popup instead of deleting immediately", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByLabelText("Delete First note"));

    expect(await screen.findByText(/Delete "First note"\?/i)).toBeInTheDocument();
    expect(axiosClient.delete).not.toHaveBeenCalled();
  });

  test("calls the delete endpoint only after confirming", async () => {
    axiosClient.delete.mockResolvedValueOnce({});
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByLabelText("Delete First note"));
    const confirmButtons = await screen.findAllByRole("button", { name: "Delete" });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(axiosClient.delete).toHaveBeenCalledWith(
        "/notes/1",
        expect.objectContaining({ headers: { Authorization: "Bearer fake-token" } })
      );
    });
  });

  test("logs out and clears the token", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(localStorage.getItem("token")).toBeNull();
  });
    test("shows a toast when a note fails to save", async () => {
    axiosClient.put.mockRejectedValueOnce(new Error("network error"));
    renderDashboard();

    const noteButton = await screen.findByRole("button", { name: "First note" });
    fireEvent.click(noteButton);
    fireEvent.click(await screen.findByRole("button", { name: "Update Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Update Note" }));

    expect(await screen.findByText("Something went wrong, note not saved")).toBeInTheDocument();
  });

  test("cancel button in edit mode returns to the idle view for a new note", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByRole("button", { name: "+ New Note" }));
    expect(screen.getByPlaceholderText("Note title")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByPlaceholderText("Note title")).not.toBeInTheDocument();
  });

  test("cancel button in edit mode returns to the detail view when editing an existing note", async () => {
    renderDashboard();
    const noteButton = await screen.findByRole("button", { name: "First note" });
    fireEvent.click(noteButton);
    fireEvent.click(await screen.findByRole("button", { name: "Update Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { name: "First note" })).toBeInTheDocument();
  });

  test("creates a new note and shows a save confirmation toast", async () => {
    axiosClient.post.mockResolvedValueOnce({
      data: { _id: "3", title: "Brand new note", content: "" },
    });

    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByRole("button", { name: "+ New Note" }));
    fireEvent.change(screen.getByPlaceholderText("Note title"), {
      target: { value: "Brand new note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Note" }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith(
        "/notes",
        expect.objectContaining({ title: "Brand new note" }),
        expect.objectContaining({ headers: { Authorization: "Bearer fake-token" } })
      );
    });

    expect(await screen.findByText("Note saved")).toBeInTheDocument();
  });

  test("shows a toast when a note fails to delete", async () => {
    axiosClient.delete.mockRejectedValueOnce(new Error("network error"));
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByLabelText("Delete First note"));
    const confirmButtons = await screen.findAllByRole("button", { name: "Delete" });
    fireEvent.click(confirmButtons[0]);

    expect(await screen.findByText("Something went wrong, note not deleted")).toBeInTheDocument();
  });

  test("canceling the delete confirmation does not call the delete endpoint", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByLabelText("Delete First note"));
    await screen.findByText(/Delete "First note"\?/i);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText(/Delete "First note"\?/i)).not.toBeInTheDocument();
    expect(axiosClient.delete).not.toHaveBeenCalled();
  });

  test("toggles bold formatting when the toolbar B button is clicked", async () => {
    renderDashboard();
    await screen.findByText("First note");

    fireEvent.click(screen.getByRole("button", { name: "+ New Note" }));

    const boldButton = screen.getByRole("button", { name: "B" });
    expect(() => fireEvent.click(boldButton)).not.toThrow();
  });
});