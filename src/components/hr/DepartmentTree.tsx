
import React, { useMemo } from "react";
import Link from "next/link";
import { Department, User } from "@/types";
import { Building2, Users } from "lucide-react";

interface DepartmentTreeProps {
  departments: Department[];
  rootDepartmentId?: string;
  managers: Record<string, User>;
}

interface DepartmentNode {
  department: Department;
  children: DepartmentNode[];
}

export function DepartmentTree({ departments, rootDepartmentId, managers }: DepartmentTreeProps) {
  // Build the department hierarchy
  const hierarchy = useMemo(() => {
    // If rootDepartmentId is provided, only show that department and its children
    let rootDepartments: Department[] = [];
    
    if (rootDepartmentId) {
      const rootDept = departments.find(dept => dept.id === rootDepartmentId);
      if (rootDept) {
        rootDepartments = [rootDept];
      }
    } else {
      // Otherwise, find departments with no parent (top level)
      rootDepartments = departments.filter(dept => !dept.parentDepartmentId);
    }
    
    // Build tree recursively
    const buildHierarchy = (department: Department): DepartmentNode => {
      const childDepartments = departments.filter(dept => dept.parentDepartmentId === department.id);
      
      return {
        department,
        children: childDepartments.map(child => buildHierarchy(child))
      };
    };
    
    return rootDepartments.map(root => buildHierarchy(root));
  }, [departments, rootDepartmentId]);

  // If no hierarchy found, show a message
  if (hierarchy.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No department hierarchy found. Create departments and set up parent-child relationships to view the chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {hierarchy.map((node, index) => (
        <DepartmentNode key={index} node={node} level={0} managers={managers} />
      ))}
    </div>
  );
}

interface DepartmentNodeProps {
  node: DepartmentNode;
  level: number;
  managers: Record<string, User>;
}

function DepartmentNode({ node, level, managers }: DepartmentNodeProps) {
  const { department, children } = node;
  const manager = department.managerId ? managers[department.managerId] : null;
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-4 border rounded-md shadow-sm bg-white dark:bg-slate-800 ${level === 0 ? 'border-green-500' : ''}`}>
        <Link href={`/hr/departments/${department.id}`} className="flex flex-col items-center no-underline">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
            <Building2 className="h-8 w-8 text-slate-500" />
          </div>
          <div className="text-center">
            <div className="font-medium">{department.name}</div>
            {manager && (
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                <span>Manager: {manager.name}</span>
              </div>
            )}
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
                  <DepartmentNode node={childNode} level={level + 1} managers={managers} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
