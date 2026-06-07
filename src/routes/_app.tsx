import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { pathname } = useLocation();
  const isTrainingScreen = pathname.startsWith("/treino");

  return (
    <div className={`mx-auto min-h-screen w-full max-w-[430px] ${isTrainingScreen ? "pb-0" : "pb-28"}`}>
      <Outlet />
      <AnimatePresence>
        {!isTrainingScreen && (
          <motion.div
            key="bottom-nav"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
