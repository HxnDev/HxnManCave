import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Preloader } from "@/components/motion/preloader";
import { AppLayout } from "@/layouts/app-layout";
import { AuthPage } from "@/pages/auth";
import { LandingPage } from "@/pages/landing";

const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const CollectionsPage = lazy(() =>
  import("@/pages/collections").then((m) => ({ default: m.CollectionsPage })),
);
const CategoriesPage = lazy(() =>
  import("@/pages/categories").then((m) => ({ default: m.CategoriesPage })),
);
const ItemFormPage = lazy(() =>
  import("@/pages/item-form").then((m) => ({ default: m.ItemFormPage })),
);
const ItemDetailPage = lazy(() =>
  import("@/pages/item-detail").then((m) => ({ default: m.ItemDetailPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsPage })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/privacy").then((m) => ({ default: m.PrivacyPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <Preloader />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="items/new" element={<ItemFormPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="items/:id/edit" element={<ItemFormPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
