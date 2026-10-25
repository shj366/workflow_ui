export interface WorkflowUserOption {
  id: string;
  username: string;
  nickname: string;
  dept_id?: null | string;
  dept_name?: null | string;
  dept_parent_id?: null | string;
}

export interface WorkflowUserTreeNode {
  children?: WorkflowUserTreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  key: string;
  title: string;
  user?: WorkflowUserOption;
  value: string;
}

export function buildWorkflowUserTree(users: WorkflowUserOption[]) {
  const groups = new Map<string, WorkflowUserTreeNode>();
  for (const user of users) {
    const deptKey = user.dept_id || 'unassigned';
    const deptTitle = user.dept_name?.trim() || '未分配部门';
    let group = groups.get(deptKey);
    if (!group) {
      group = {
        key: `dept:${deptKey}`,
        value: `dept:${deptKey}`,
        title: deptTitle,
        disabled: true,
        children: [],
      };
      groups.set(deptKey, group);
    }
    const children = group.children;
    if (!children) throw new Error(`用户组节点缺少 children: ${deptKey}`);
    children.push({
      key: `user:${user.username}`,
      value: user.username,
      title: user.nickname || user.username,
      isLeaf: true,
      user,
    });
  }
  return [...groups.values()];
}
