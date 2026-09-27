import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

const LANGUAGES = [
  {
    code: "zh-TW",
    hero: "讓 AI Spirit 陪你在真實世界一起成長。",
    title: "Nightasaur — 陪你學習、創作與現實成長的 AI Spirit",
    nav: ["英語訓練對話", "登入", "註冊"],
    openMenu: "開啟選單",
  },
  {
    code: "zh-CN",
    hero: "让 AI Spirit 陪你在真实世界一起成长。",
    title: "Nightasaur — 陪你学习、创作与现实成长的 AI Spirit",
    nav: ["英语训练对话", "登录", "注册"],
    openMenu: "打开菜单",
  },
  {
    code: "en-US",
    hero: "Grow in the real world with your AI Spirit.",
    title: "Nightasaur — AI Spirit for Learning, Creation and Real-World Growth",
    nav: ["English Conversation Practice", "Login", "Register"],
    openMenu: "Open menu",
  },
  {
    code: "ja-JP",
    hero: "AI Spirit と一緒に、現実世界で成長しよう。",
    title: "Nightasaur — 学習・創作・現実の成長を支える AI Spirit",
    nav: ["英会話トレーニング", "ログイン", "登録"],
    openMenu: "メニューを開く",
  },
  {
    code: "ko-KR",
    hero: "AI Spirit과 함께 현실 세계에서 성장하세요.",
    title: "Nightasaur — 학습·창작·현실 성장을 함께하는 AI Spirit",
    nav: ["영어 회화 연습", "로그인", "가입"],
    openMenu: "메뉴 열기",
  },
] as const;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  document.documentElement.lang = "zh-TW";
});

afterEach(() => {
  cleanup();
});

describe.each(LANGUAGES)("public language contract: $code", ({ code, hero, title, nav, openMenu }) => {
  it("keeps homepage, metadata, document language, and navigation aligned", async () => {
    localStorage.setItem("nightasaur_language", code);
    render(<App />);

    expect(await screen.findByText(hero)).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(title));
    expect(document.documentElement.lang).toBe(code);

    for (const label of nav) {
      expect(screen.getAllByRole("link").filter((link) => link.textContent?.includes(label)).length).toBeGreaterThan(0);
    }

    fireEvent.click(screen.getByRole("button", { name: openMenu }));
    for (const label of nav) {
      expect(screen.getAllByRole("link").filter((link) => link.textContent?.includes(label)).length).toBeGreaterThan(1);
    }
  });
});

it("persists a language selection across an application remount", async () => {
  const firstRender = render(<App />);

  fireEvent.click(screen.getAllByRole("button", { name: /zh-TW/ })[0]);
  fireEvent.click(screen.getByRole("button", { name: /English English/ }));

  await waitFor(() => {
    expect(localStorage.getItem("nightasaur_language")).toBe("en-US");
    expect(document.documentElement.lang).toBe("en-US");
    expect(document.title).toBe("Nightasaur — AI Spirit for Learning, Creation and Real-World Growth");
  });

  firstRender.unmount();
  render(<App />);

  expect(await screen.findByText("Grow in the real world with your AI Spirit.")).toBeInTheDocument();
  await waitFor(() => expect(document.title).toBe("Nightasaur — AI Spirit for Learning, Creation and Real-World Growth"));
  expect(document.documentElement.lang).toBe("en-US");
});
