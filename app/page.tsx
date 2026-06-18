import { EveRuntimeProvider } from "./EveRuntimeProvider";
import { Thread } from "./Thread";

export default function Page() {
  return (
    <EveRuntimeProvider>
      <div className="app">
        <header className="header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="https://duyet.net/favicon.ico" alt="duyet.net" />
          <span className="title">eved</span>
          <a className="by" href="https://duyet.net" target="_blank" rel="noreferrer">
            duyet.net
          </a>
        </header>
        <Thread />
      </div>
    </EveRuntimeProvider>
  );
}
