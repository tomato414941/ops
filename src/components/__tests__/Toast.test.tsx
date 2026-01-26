import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastContext";
import { ToastContainer } from "../Toast";

function TestComponent() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Success message", "success")}>Show Success</button>
      <button onClick={() => showToast("Error message", "error")}>Show Error</button>
      <button onClick={() => showToast("Info message", "info")}>Show Info</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestComponent />
      <ToastContainer />
    </ToastProvider>
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows success toast when triggered", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("shows error toast when triggered", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("shows info toast when triggered", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Info"));
    expect(screen.getByText("Info message")).toBeInTheDocument();
  });

  it("auto-dismisses toast after 3 seconds", async () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("removes toast when close button is clicked", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("閉じる");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("can show multiple toasts", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("has proper ARIA attributes for accessibility", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));

    const container = screen.getByText("Success message").closest('[aria-live]');
    expect(container).toHaveAttribute("aria-live", "polite");
    expect(container).toHaveAttribute("aria-atomic", "true");
  });

  it("applies correct styling for success toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Success"));

    const toast = screen.getByRole("alert");
    expect(toast).toHaveClass("bg-green-600");
  });

  it("applies correct styling for error toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Error"));

    const toast = screen.getByRole("alert");
    expect(toast).toHaveClass("bg-red-600");
  });

  it("applies correct styling for info toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Show Info"));

    const toast = screen.getByRole("alert");
    expect(toast).toHaveClass("bg-blue-600");
  });
});

describe("useToast", () => {
  it("throws error when used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function InvalidComponent() {
      useToast();
      return null;
    }

    expect(() => render(<InvalidComponent />)).toThrow(
      "useToast must be used within a ToastProvider"
    );

    consoleError.mockRestore();
  });
});
