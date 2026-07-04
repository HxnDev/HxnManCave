import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/layouts/app-layout";
import { AuthPage } from "@/pages/auth";
import { CategoriesPage } from "@/pages/categories";
import { CollectionsPage } from "@/pages/collections";
import { DashboardPage } from "@/pages/dashboard";
import { LandingPage } from "@/pages/landing";
import { SettingsPage } from "@/pages/settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
