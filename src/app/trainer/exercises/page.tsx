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
import { ActionFeedback } from "@/components/ui/action-feedback";

export const metadata: Metadata = {
  title: "Exercise library",
};

export default async function TrainerExerciseLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; added?: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const params = await searchParams;
  const search = params.q?.trim() || undefined;

  // canViewExerciseLibrary already allows TRAINER — this page is a view of
  // the same shared catalogue the admin sees, minus the editing controls a
  // trainer only has for their own entries.
  const exercises = await listExercises(actor, { search });
  const muscleGroups = muscleGroupsOf(exercises);
  // Only a group that actually exists counts as a filter.
  const muscle = muscleGroups.includes(params.muscle ?? "") ? params.muscle : undefined;
  const visible = muscle ? exercises.filter((exercise) => exercise.muscleGroup?.trim() === muscle) : exercises;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exercise library"
        description={`${exercises.length} exercise${exercises.length === 1 ? "" : "s"} available when building a plan`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/trainer/exercises/new">
                <Plus aria-hidden="true" />
                Add exercise
              </Link>
            }
          />
        }
      />

      {params.added ? <ActionFeedback>Exercise added to the library.</ActionFeedback> : null}

      {/* Zero-JS GET form: submits without any client component. */}
      <ExerciseLibraryFilters
        basePath="/trainer/exercises"
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
              : "Add the first exercise so you can start building workout days."
          }
          action={
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/trainer/exercises/new">Add exercise</Link>}
            />
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((exercise) => (
            <li key={exercise.id}>
              <ListCard
                icon={Dumbbell}
                title={exercise.name}
                subtitle={exercise.muscleGroup ?? undefined}
                meta={exercise.description ?? undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
