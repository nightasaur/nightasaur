import * as OpenCC from "opencc-js";

export type Lang = "zh-TW" | "zh-CN" | "en" | "ja" | "ko" | "es";

type ConverterFn = (text: string) => string;

let s2tConverter: ConverterFn | null = null;
let t2sConverter: ConverterFn | null = null;

function getS2T(): ConverterFn {
  if (!s2tConverter) {
    s2tConverter = OpenCC.Converter({ from: "cn", to: "tw" }) as ConverterFn;
  }
  return s2tConverter;
}

function getT2S(): ConverterFn {
  if (!t2sConverter) {
    t2sConverter = OpenCC.Converter({ from: "tw", to: "cn" }) as ConverterFn;
  }
  return t2sConverter;
}

export function normalizeChinese(text: string, language: Lang): string {
  if (!text) return text;
  if (language === "zh-TW") {
    return getS2T()(text);
  }
  if (language === "zh-CN") {
    return getT2S()(text);
  }
  return text;
}