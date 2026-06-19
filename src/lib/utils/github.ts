export interface RepoNode {
    name: string;
    type: "file" | "dir";
    path: string;
    children?: RepoNode[];
}

export function parseGithubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
    try {
        const cleanUrl = url.trim().replace(/\/$/, "");
        const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/(?:tree|blob)\/([^\/]+))?/i);
        if (!match) return null;
        return {
            owner: match[1],
            repo: match[2],
            branch: match[3] || undefined
        };
    } catch (e) {
        return null;
    }
}

export async function fetchRepoTree(owner: string, repo: string, branch: string = "main"): Promise<{ tree: RepoNode[], flat: any[], defaultBranch: string }> {
    try {
        // 1. Fetch Repository Details to confirm existence & find default branch if needed
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoRes.ok) throw new Error("Repository not found or private");
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || branch;

        // 2. Fetch Git Tree recursively
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
        if (!treeRes.ok) throw new Error("Failed to fetch repository Git tree");
        const treeData = await treeRes.json();

        if (!treeData.tree || !Array.isArray(treeData.tree)) {
            return { tree: [], flat: [], defaultBranch };
        }

        // Filter and build tree
        const flatList = treeData.tree.map((item: any) => ({
            path: item.path,
            type: item.type === "tree" ? "tree" : "blob"
        }));

        const tree = sortTree(buildHierarchy(flatList));

        return { tree, flat: flatList, defaultBranch };
    } catch (error) {
        console.error("Error fetching repository tree:", error);
        throw error;
    }
}

export async function fetchPackageJson(owner: string, repo: string, branch: string = "main"): Promise<any | null> {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/package.json`);
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        return null;
    }
}

function buildHierarchy(flatList: { path: string; type: "tree" | "blob" }[]): RepoNode[] {
    const rootNodes: RepoNode[] = [];
    const pathMap = new Map<string, RepoNode>();

    // Sort by path depth so parents are processed before their descendants
    const sortedList = [...flatList].sort((a, b) => a.path.split("/").length - b.path.split("/").length);

    for (const item of sortedList) {
        const pathParts = item.path.split("/");
        const name = pathParts[pathParts.length - 1];
        const type = item.type === "tree" ? "dir" : "file";

        const node: RepoNode = {
            name,
            type,
            path: item.path,
            ...(type === "dir" ? { children: [] } : {})
        };

        pathMap.set(item.path, node);

        if (pathParts.length === 1) {
            rootNodes.push(node);
        } else {
            const parentPath = pathParts.slice(0, -1).join("/");
            const parentNode = pathMap.get(parentPath);
            if (parentNode && parentNode.children) {
                parentNode.children.push(node);
            } else {
                rootNodes.push(node);
            }
        }
    }

    return rootNodes;
}

function sortTree(nodes: RepoNode[]): RepoNode[] {
    const sorted = [...nodes].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "dir" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    for (const node of sorted) {
        if (node.children) {
            node.children = sortTree(node.children);
        }
    }

    return sorted;
}

export function identifyTechStack(flatList: { path: string; type: string }[], packageJson: any): string[] {
    const stack = new Set<string>();

    if (packageJson) {
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps["next"]) stack.add("Next.js");
        if (deps["react"]) stack.add("React");
        if (deps["typescript"]) stack.add("TypeScript");
        if (deps["tailwindcss"]) stack.add("Tailwind CSS");
        if (deps["three"]) stack.add("Three.js");
        if (deps["framer-motion"]) stack.add("Framer Motion");
        if (deps["express"]) stack.add("Express");
        if (deps["prisma"]) stack.add("Prisma");
        if (deps["drizzle-orm"]) stack.add("Drizzle ORM");
        if (deps["supabase"]) stack.add("Supabase");
        if (deps["firebase"]) stack.add("Firebase App");
        if (deps["vue"]) stack.add("Vue.js");
        if (deps["angular"]) stack.add("Angular");
        if (deps["svelte"]) stack.add("Svelte");
        if (deps["django"]) stack.add("Django");
    }

    for (const item of flatList) {
        const ext = item.path.split(".").pop()?.toLowerCase();
        if (ext === "tsx" || ext === "ts") stack.add("TypeScript");
        if (ext === "py") stack.add("Python");
        if (ext === "go") stack.add("Go");
        if (ext === "rs") stack.add("Rust");
        if (ext === "java") stack.add("Java");
        if (ext === "cpp" || ext === "h") stack.add("C++");
        if (ext === "sol") stack.add("Solidity (Web3)");
        if (item.path.includes("package.json")) stack.add("Node.js / JS");
    }

    if (stack.size === 0) {
        stack.add("HTML / CSS / JS");
    }

    return Array.from(stack);
}
