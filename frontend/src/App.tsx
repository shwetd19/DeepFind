import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider, RedirectIfAuthed, RequireAuth } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import Home from "@/pages/Home";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              <RedirectIfAuthed>
                <Auth />
              </RedirectIfAuthed>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/conversations" element={<Home />} />
            <Route path="/conversations/:conversationId" element={<Chat />} />
          </Route>
          <Route path="*" element={<Navigate to="/conversations" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
