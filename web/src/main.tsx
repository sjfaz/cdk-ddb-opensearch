import { useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "./pages/home";
import Analysis from "./pages/analysis";
import { QueryClient, QueryClientProvider } from "react-query";
import { trpc } from "../utils/trpc";
import { ReactLocation, Router } from "@tanstack/react-location";
import "@cloudscape-design/global-styles/index.css";
import "./style/index.css";

let url = "";
const getUrl = async () => {
  if (url) {
    return url;
  }
  const response = await fetch("./config.json");
  url = `${(await response.json()).apiUrl}beta`;
  return url;
};

interface MainProps {
  url: string;
}

function Main(props: MainProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    // const token = localStorage.getItem("token");
    const apiUrl = props.url;
    return trpc.createClient({
      url: apiUrl,
    });
  });

  console.log("rendering...");
  const location = new ReactLocation();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router
          location={location}
          routes={[
            { path: "/", element: <Home /> },
            { path: "/analysis", element: <Analysis /> },
          ]}
        ></Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

let container: HTMLElement;
document.addEventListener("DOMContentLoaded", async () => {
  const apiUrl = await getUrl();
  if (!container) {
    container = document.getElementById("root") as HTMLElement;
    createRoot(container).render(<Main url={apiUrl} />);
  }
});

// const container = document.getElementById("root") as HTMLElement;
// createRoot(container).render(
//   <React.StrictMode>
//     <Main url={await getUrl()} />
//   </React.StrictMode>
// );
