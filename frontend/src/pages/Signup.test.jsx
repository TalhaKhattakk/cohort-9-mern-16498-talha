import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "./Signup";
import axiosClient from "../api/axiosClient";

jest.mock("../api/axiosClient");

function renderSignup() {
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
}


describe("Signup page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders name, email, and password fields and a submit button", () => {
    renderSignup();
    expect(screen.getAllByRole("textbox")).toHaveLength(2); // name + email are type="text"/"email", both textbox role
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  test("shows the backend's error message when signup fails", async () => {
    axiosClient.post.mockRejectedValueOnce({
      response: { data: { message: "User already exists with this email" } },
    });

    renderSignup();

    const [nameInput] = screen.getAllByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Talha" } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "existing@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("User already exists with this email")).toBeInTheDocument();
    });
  });

  test("shows a generic error when there is no response from the server", async () => {
    axiosClient.post.mockRejectedValueOnce({});

    renderSignup();

    const [nameInput] = screen.getAllByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Talha" } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  test("calls the signup endpoint with the entered name, email, and password", async () => {
    axiosClient.post.mockResolvedValueOnce({ data: {} });

    renderSignup();

    const [nameInput] = screen.getAllByRole("textbox");
    fireEvent.change(nameInput, { target: { value: "Talha" } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "talha@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith("/auth/signup", {
        name: "Talha",
        email: "talha@test.com",
        password: "password123!",
      });
    });
  });
});