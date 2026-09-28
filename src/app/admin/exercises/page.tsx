import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listExercises } from "@/server/services/exercise.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { ExerciseLibraryFilters, muscleGroupsOf } from "@/components/exercises/library-filters";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = {
  title: "Exercise library",
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;
  const search = params.q?.trim() || undefined;

  const exercises = await listExercises(actor, { search, includeInactive: true });
  const muscleGroups = muscleGroupsOf(exercises);
  // Only a group that actually exists counts as a filter.
  const muscle = muscleGroups.includes(params.muscle ?? "") ? params.muscle : undefined;
  const visible = muscle ? exercises.filter((exercise) => exercise.muscleGroup?.trim() === muscle) : exercises;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exercise library"
        description={`${exercises.length} exercise${exercises.length === 1 ? "" : "s"} shared across every workout plan`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/exercises/new">
                <Plus aria-hidden="true" />
                Add exercise
              </Link>
            }
          />
        }
      />

      <ExerciseLibraryFilters
        basePath="/admin/exercises"
        search={search}
        muscle={muscle}
        muscleGroups={muscleGroups}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={search || muscle ? "No exercises match" : "The library is empty"}
          description={
            search || muscle
              ? "Try a different name or muscle group, or add this exercise to the library."
              : "Add exercises so trainers can build workout days from them."
          }
          action={
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/exercises/new">Add exercise</Link>}
            />
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((exercise) => (
            <li key={exercise.id}>
              <ListCard
                href={`/admin/exercises/${exercise.id}`}
                icon={Dumbbell}
                title={exercise.name}
                subtitle={exercise.muscleGroup ?? undefined}
                trailing={
                  <StatusBadge
                    kind="exercise"
                    status={exercise.isActive ? "ACTIVE" : "INACTIVE"}
                    size="sm"
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
