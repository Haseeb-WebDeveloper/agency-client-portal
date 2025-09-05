import Image from "next/image";

interface Project {
  id: string;
  title: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
}

interface OngoingProjectsProps {
  projects: Project[];
}

export function OngoingProjects({ projects }: OngoingProjectsProps) {
  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'text-figma-warning';
      case 'IN_PROGRESS':
        return 'text-figma-primary';
      case 'REVIEW':
        return 'text-figma-success';
      default:
        return 'text-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'Planning';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'REVIEW':
        return 'Review';
      default:
        return status;
    }
  };

  return (
    <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/stop-watch.svg"
          alt="Ongoing Projects"
          width={20}
          height={20}
        />
        <p className="figma-paragraph text-foreground">Ongoing Projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/60">No ongoing projects</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const progressPercentage = getProgressPercentage(
              parseInt(project.completed_tasks),
              parseInt(project.total_tasks)
            );

            return (
              <div key={project.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    {project.title}
                  </h4>
                  <span className={`text-xs ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>
                      {project.completed_tasks} of {project.total_tasks} tasks completed
                    </span>
                    <span>{progressPercentage}%</span>
                  </div>
                  
                  <div className="w-full bg-foreground/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-figma-primary to-figma-primary-purple-1 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
