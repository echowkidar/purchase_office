import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "AFO_STAFF" | "DEPT_USER";
      departmentId: string | null;
      departmentName: string | null;
      departmentCode: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    departmentId: string | null;
    departmentName: string | null;
    departmentCode: string | null;
  }
}
