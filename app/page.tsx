import { FaGithub, FaTelegram } from "react-icons/fa6";
import { EveRuntimeProvider } from "./EveRuntimeProvider";
import { Thread } from "./Thread";
import { ThemeToggle } from "./ThemeToggle";

export default function Page() {
  return (
    <EveRuntimeProvider>
      <div className="app">
        <header className="header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="https://duyet.net/favicon.ico" alt="duyet.net" />
          <span className="title">eved</span>
          <div className="header-actions">
            <a className="by" href="https://duyet.net" target="_blank" rel="noreferrer">
              duyet.net
            </a>
            <a
              className="icon-btn"
              href="https://github.com/duyet/eved"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              title="View on GitHub"
            >
              <FaGithub size={18} />
            </a>
            <a
              className="icon-btn"
              href="https://t.me/evedx_bot"
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on Telegram"
              title="Chat via Telegram"
            >
              <FaTelegram size={18} />
            </a>
            <ThemeToggle />
          </div>
        </header>
        <Thread />
      </div>
    </EveRuntimeProvider>
  );
}
