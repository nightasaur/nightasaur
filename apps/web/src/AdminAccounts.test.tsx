import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import AdminAccounts from "./pages/AdminAccounts";
import { adminAccountsAPI, authAPI } from "./api/client";
vi.mock("./api/client", () => ({
  authAPI: { me: vi.fn() },
  adminAccountsAPI: { list: vi.fn(), action: vi.fn(), history: vi.fn() },
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authAPI.me).mockResolvedValue({ data: { role: "ADMIN" } } as any);
  vi.mocked(adminAccountsAPI.list).mockResolvedValue({
    data: {
      users: [
        {
          id: "u1",
          username: "sample",
          email: "sample@example.invalid",
          role: "USER",
          isActive: true,
        },
      ],
      total: 1,
    },
  } as any);
  vi.mocked(adminAccountsAPI.action).mockResolvedValue({ data: {} } as any);
});
it("denies ordinary users without fetching account lists", async () => {
  vi.mocked(authAPI.me).mockResolvedValue({ data: { role: "USER" } } as any);
  render(<AdminAccounts />);
  expect(await screen.findByRole("alert")).toHaveTextContent("僅限管理員");
  expect(adminAccountsAPI.list).not.toHaveBeenCalled();
});
it("requires a reason and explicit confirmation before suspending", async () => {
  render(<AdminAccounts />);
  fireEvent.click(
    await screen.findByRole("button", { name: "封禁" }),
  );
  expect(adminAccountsAPI.action).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "確認執行" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: /操作原因/ }), {
    target: { value: "confirmed abuse report" },
  });
  fireEvent.click(screen.getByRole("button", { name: "確認執行" }));
  await waitFor(() =>
    expect(adminAccountsAPI.action).toHaveBeenCalledWith("u1", {
      action: "BAN",
      reason: "confirmed abuse report",
    }),
  );
  expect(await screen.findByText(/封禁帳號完成/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /刪除/ }),
  ).not.toBeInTheDocument();
});
it("does not offer actions against protected administrators", async () => {
  vi.mocked(adminAccountsAPI.list).mockResolvedValue({
    data: {
      users: [
        {
          id: "a1",
          username: "owner",
          email: "ceo@cccbuyear.com",
          role: "ADMIN",
          isActive: true,
        },
      ],
      total: 1,
    },
  } as any);
  render(<AdminAccounts />);
  expect(await screen.findByText("管理員 · 受保護")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "封禁" }),
  ).not.toBeInTheDocument();
});
