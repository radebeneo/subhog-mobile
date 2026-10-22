// Node-only test transport. Never imported by application code or Metro.
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const mocks = new URL("./native-mocks.mjs", import.meta.url).href;
const stubbed = new Set(["react-native", "react-native-safe-area-context", "nativewind", "react-native-svg", "@clerk/expo", "expo-router", "posthog-react-native"]);
Object.defineProperty(globalThis, "__DEV__", { value: true, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (stubbed.has(specifier)) return { url: mocks, shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const relative = specifier.slice(2);
      const base = new URL(relative.startsWith("assets/") || relative === "global.css" ? relative : `src/${relative}`, root);
      for (const suffix of ["", ".ts", ".tsx"]) {
        const url = new URL(base.href + suffix);
        if (fs.existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
      }
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(root.href)) {
      const base = new URL(specifier, context.parentURL);
      for (const suffix of ["", ".ts", ".tsx"]) {
        const url = new URL(base.href + suffix);
        if (fs.existsSync(fileURLToPath(url)) && fs.statSync(fileURLToPath(url)).isFile()) {
          return { url: url.href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && /\.(png|ttf|css)$/.test(url)) {
      return { format: "module", source: "export default 'test-asset';", shortCircuit: true };
    }
    if (url.startsWith(root.href) && url.endsWith(".tsx")) {
      const source = ts.transpileModule(fs.readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
