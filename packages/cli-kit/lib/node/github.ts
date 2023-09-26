export interface RepositoryReference {
  baseUrl: string
  branch?: string
  path?: string
}

export function parseRepositoryReference(reference: string): RepositoryReference {
  const url = new URL(reference);

  const [, user, repo, ...repoPath] = url.pathname.split('/');

  return {
    baseUrl: `${url.origin}/${user}/${repo}`,
    branch: url.hash ? url.hash.slice(1) : undefined,
    path: repoPath.length > 0 ? repoPath.join('/') : undefined,
  };
}
