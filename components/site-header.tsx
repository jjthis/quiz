import Link from "next/link"

import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  active?: "home" | "create" | "manage"
}

export function SiteHeader({ active = "home" }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            Q
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
              Quiz Hub
            </p>
            <p className="text-xs text-slate-500">4지선다 퀴즈 플랫폼</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === "home"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            플레이
          </Link>
          <Link
            href="/manage"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === "manage"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-amber-50 hover:text-amber-700",
            )}
          >
            퀴즈 관리
          </Link>
          <Link
            href="/create"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === "create"
                ? "bg-violet-600 text-white"
                : "text-slate-600 hover:bg-violet-50 hover:text-violet-700",
            )}
          >
            퀴즈 만들기
          </Link>
        </nav>
      </div>
    </header>
  )
}
