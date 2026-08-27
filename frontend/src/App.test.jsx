import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import axiosClient from "./api/axiosClient";

jest.mock("./api/axiosClient");

describe("Route protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("redirects to /login when visiting /dashboard with no token", async () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
  });

  test("allows /dashboard to render when a token is present", async () => {
    localStorage.setItem("token", "fake-token");
    axiosClient.get.mockImplementation((url) => {
      if (url === "/notes") return Promise.resolve({ data: [] });
      if (url === "/auth/me") return Promise.resolve({ data: { user: { name: "Talha", email: "t@test.com" } } });
      return Promise.reject(new Error("unknown url"));
    });

    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    expect(await screen.findByPlaceholderText("Search notes...")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
  });
});