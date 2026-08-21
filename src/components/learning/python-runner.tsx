"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, TerminalSquare } from "lucide-react";

interface PythonRunnerProps {
  title: string;
  starterCode: string;
  expectedOutput: string;
  onPassed?: (code: string, output: string) => void;
  onRun?: (code: string, output: string, passed: boolean) => void;
}

/** XMZADD 20260819 在浏览器 Worker 中运行受限基础 Python 练习并反馈判题结果。 */
export function PythonRunner({
  title,
  starterCode,
  expectedOutput,
  onPassed,
  onRun,
}: PythonRunnerProps) {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  function resetRunner() {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function armExecutionTimeout() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      resetRunner();
      setRunning(false);
      setOutput("运行超过 4 秒已停止。先检查是否存在无限循环。");
    }, 4000);
  }

  function runCode() {
    resetRunner();
    setRunning(true);
    setOutput("正在准备浏览器 Python 环境...");
    setPassed(false);

    const worker = new Worker("/learning/python-runner.js");
    workerRef.current = worker;
    timeoutRef.current = window.setTimeout(() => {
      resetRunner();
      setRunning(false);
      setOutput(
        "Python 引擎启动超过 20 秒。请检查网络后重试，或改用本地 PyCharm。",
      );
    }, 20000);

    worker.onmessage = (
      event: MessageEvent<{ type?: "ready"; ok?: boolean; output?: string }>,
    ) => {
      if (event.data.type === "ready") {
        armExecutionTimeout();
        return;
      }
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      const nextOutput = event.data.output || "";
      const nextPassed =
        Boolean(event.data.ok) && nextOutput.includes(expectedOutput);
      setRunning(false);
      setOutput(nextOutput);
      setPassed(nextPassed);
      onRun?.(code, nextOutput, nextPassed);
      if (nextPassed) onPassed?.(code, nextOutput);
      resetRunner();
    };

    worker.onerror = () => {
      resetRunner();
      setRunning(false);
      setOutput(
        "浏览器 Python 环境加载失败。请检查网络后重试，或改用本地 PyCharm。",
      );
    };
    worker.postMessage({ code });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TerminalSquare className="h-4 w-4" />
            写代码练习：{title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            代码会在浏览器本地运行，仅用于基础 Python 判题，不是处理密钥、公司数据或网络请求的安全环境；这些内容请在本地 PyCharm 项目完成。
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          期望输出：{expectedOutput}
        </span>
      </div>
      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        className="mt-4 min-h-[220px] w-full resize-y rounded-lg border border-border bg-zinc-950 px-4 py-3 font-mono text-sm leading-6 text-zinc-100 outline-none focus:border-primary/50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={running}
          onClick={runCode}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {running ? "运行中..." : "运行代码"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCode(starterCode);
            setOutput("");
            setPassed(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
        {passed && (
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            通过：你已经满足本题的最小要求。
          </span>
        )}
      </div>
      <pre className="mt-4 min-h-[76px] overflow-x-auto rounded-lg border border-border bg-secondary/50 p-3 text-xs leading-6 text-muted-foreground whitespace-pre-wrap">
        {output || "运行结果会显示在这里。"}
      </pre>
    </section>
  );
}
