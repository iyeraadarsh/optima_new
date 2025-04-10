
import React, { useMemo } from "react";
import Link from "next/link";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrganizationChartProps {
  employees: User[];
  managers: Record<string, User>;
}

interface EmployeeNode {
  employee: User;
  children: EmployeeNode[];
}

export function OrganizationChart({ employees, managers }: OrganizationChartProps) {
  // Build the organization hierarchy
  const hierarchy = useMemo(() => {
    // Find employees with no reporting manager (top level)
    const rootEmployees = employees.filter(emp => !emp.reportingManager);
    
    // Build tree recursively
    const buildHierarchy = (employee: User): EmployeeNode => {
      const directReports = employees.filter(emp => emp.reportingManager === employee.id);
      
      return {
        employee,
        children: directReports.map(report => buildHierarchy(report))
      };
    };
    
    return rootEmployees.map(root => buildHierarchy(root));
  }, [employees]);

  // If no hierarchy found, show a message
  if (hierarchy.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No organization hierarchy found. Set up reporting relationships to view the chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {hierarchy.map((node, index) => (
        <OrgChartNode key={index} node={node} level={0} />
      ))}
    </div>
  );
}

interface OrgChartNodeProps {
  node: EmployeeNode;
  level: number;
}

function OrgChartNode({ node, level }: OrgChartNodeProps) {
  const { employee, children } = node;
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-4 border rounded-md shadow-sm bg-white dark:bg-slate-800 ${level === 0 ? 'border-blue-500' : ''}`}>
        <Link href={`/hr/employees/${employee.id}`} className="flex flex-col items-center no-underline">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage 
              src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random&size=64`} 
              alt={employee.name} 
            />
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="font-medium">{employee.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {employee.jobDetails?.title || employee.role}
            </div>
          </div>
        </Link>
      </div>
      
      {children.length > 0 && (
        <>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
          <div className="relative flex items-center">
            <div className="absolute top-0 left-1/2 w-px h-6 -translate-x-1/2 bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              {children.map((childNode, index) => (
                <div key={index} className="flex flex-col items-center">
                  <OrgChartNode node={childNode} level={level + 1} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
