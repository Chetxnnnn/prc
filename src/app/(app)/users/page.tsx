"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { UserTable } from "@/components/features/users/user-table";
import { StudentApprovalTable } from "@/components/features/users/student-approval-table";
import { getUsers } from "@/actions/users";
import { getPendingStudents } from "@/actions/student-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Tables } from "@/types/database.types";

type Student = Tables<"students">;

export default function UsersPage() {
  const [users, setUsers] = useState<Tables<"profiles">[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, studentData] = await Promise.all([
        getUsers(),
        getPendingStudents(),
      ]);
      setUsers(userData);
      setStudents(studentData);
    } catch (e) {
      console.error("Failed to load users", e);
      toast.error(
        "Failed to load users: " + (e instanceof Error ? e.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <>
      <AppHeader
        title="Users"
        subtitle={`${users.length} staff, ${students.length} students`}
      />
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Staff ({users.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <UserTable data={users} loading={loading} onRefresh={loadUsers} />
        </TabsContent>
        <TabsContent value="students">
          <StudentApprovalTable data={students} loading={loading} onRefresh={loadUsers} />
        </TabsContent>
      </Tabs>
    </>
  );
}
