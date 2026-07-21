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
  const isStudentAuthRoute =
    pathname === "/student/login" || pathname === "/student/signup";
  const isStaffRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/fees") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const isStudentPendingRoute = pathname === "/student/pending";
  const isStaffPendingRoute = pathname === "/pending";

  if (!user) {
    if (isStaffRoute || isStaffPendingRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isStudentRoute && !isStudentAuthRoute) {
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

    if (isStudentRoute && !isStudentPendingRoute) {
      if (!isApprovedStudent) {
        return NextResponse.redirect(new URL("/student/pending", request.url));
      }
    }

    if (isStudentPendingRoute && isApprovedStudent) {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  } else {
    const isApprovedStaff =
      !!profile && !!profile.is_approved && !!profile.is_active;

    if (isStudentRoute && !isStudentAuthRoute) {
      if (!isApprovedStaff) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isStaffRoute) {
      if (!isApprovedStaff) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
    }

    if (isAuthRoute) {
      if (!isApprovedStaff) {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isStaffPendingRoute) {
      if (isApprovedStaff) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Unapproved/inactive staff stay on /pending — never redirect away,
      // otherwise /pending loops into itself (ERR_TOO_MANY_REDIRECTS).
      return response;
    }

    if (!isStaffRoute && !isAuthRoute && !isStudentRoute && !isApprovedStaff) {
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
