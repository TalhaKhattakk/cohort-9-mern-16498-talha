import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import axiosClient from "../api/axiosClient";

// this will replace the actual axiosClient with a mock version for testing purposes
jest.mock("../api/axiosClient");

function renderLogin() {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders the email and password fields and a submit button", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("shows an error message when login fails with a bad response", async () => {
    axiosClient.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  test("shows a generic error when there is no response from the server", async () => {
    axiosClient.post.mockRejectedValueOnce({});

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  test("saves the token to localStorage on successful login", async () => {
    axiosClient.post.mockResolvedValueOnce({
      data: { token: "fake-jwt-token" },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]'), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
    });
  });
});