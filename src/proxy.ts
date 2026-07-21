import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isStudentRoute = pathname.startsWith("/student/");
  const isStaffRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/fees") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const isPendingRoute = pathname === "/student/pending";

  if (!user) {
    if (isStaffRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isStudentRoute && !pathname.startsWith("/student/login") && !pathname.startsWith("/student/signup")) {
      return NextResponse.redirect(new URL("/student/login", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_approved, is_active")
    .eq("id", user.id)
    .single();

  const isStudent = profile?.role === "student" || user.user_metadata?.role === "student";

  if (isStudent) {
    const { data: student } = await supabase
      .from("students")
      .select("is_approved")
      .eq("auth_user_id", user.id)
      .single();

    const isApprovedStudent = student?.is_approved;

    if (isStaffRoute || isAuthRoute) {
      if (!isApprovedStudent) {
        return NextResponse.redirect(new URL("/student/pending", request.url));
      }
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }

    if (isStudentRoute && !isPendingRoute) {
      if (!isApprovedStudent) {
        return NextResponse.redirect(new URL("/student/pending", request.url));
      }
    }

    if (isPendingRoute && isApprovedStudent) {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  } else {
    if (isStudentRoute && !pathname.startsWith("/student/login") && !pathname.startsWith("/student/signup")) {
      if (!profile || !profile.is_approved || !profile.is_active) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isStaffRoute) {
      if (!profile || !profile.is_approved || !profile.is_active) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
    }

    if (isAuthRoute) {
      if (!profile || !profile.is_approved || !profile.is_active) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname === "/pending") {
      if (profile?.is_approved && profile?.is_active) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  if (!isStudent && !isStaffRoute && !isAuthRoute && !isPendingRoute && !isStudentRoute) {
    if (!profile || !profile.is_approved || !profile.is_active) {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
