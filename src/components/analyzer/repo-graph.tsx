"use client";

import { motion } from "framer-motion";
import { Folder, FileText, ExternalLink } from "lucide-react";
import { RepoNode } from "@/lib/utils/github";

interface RepoGraphProps {
    nodes: RepoNode[];
    repoUrl: string;
}

interface PositionedNode extends RepoNode {
    x: number;
    y: number;
    level: number;
    parentId?: string;
    parentPos?: { x: number; y: number };
}

export function RepoGraph({ nodes, repoUrl }: RepoGraphProps) {
    const nodeWidth = 200;
    const nodeHeight = 60;
    const colGap = 280;
    const rowGap = 40;
    const paddingX = 60;
    const paddingY = 60;

    // Function to flatten and position nodes recursively
    const processNodes = () => {
        const flattened: PositionedNode[] = [];
        const levelCounts: number[] = [1]; // Start with Root

        const traverse = (node: RepoNode, level: number, parentX: number, parentY: number, parentId?: string) => {
            const currentLevel = level + 1;
            if (!levelCounts[currentLevel]) levelCounts[currentLevel] = 0;

            const x = paddingX + currentLevel * colGap;
            const y = paddingY + levelCounts[currentLevel] * (nodeHeight + rowGap);

            levelCounts[currentLevel]++;

            const positionedNode: PositionedNode = {
                ...node,
                x,
                y,
                level: currentLevel,
                parentId,
                parentPos: { x: parentX, y: parentY }
            };

            flattened.push(positionedNode);

            if (node.children) {
                node.children.forEach(child => traverse(child, currentLevel, x, y, node.path));
            }
        };

        const maxNodesInAnyLevel = Math.max(...levelCounts.filter(Boolean));
        const totalContentHeight = paddingY * 2 + maxNodesInAnyLevel * (nodeHeight + rowGap);

        const rootX = paddingX;
        const rootY = totalContentHeight / 2;

        nodes.forEach(node => traverse(node, 0, rootX, rootY, "root"));

        return { flattened, rootX, rootY };
    };

    const { flattened, rootX, rootY } = processNodes();
    const maxLevel = Math.max(...flattened.map(n => n.level));
    const maxRows = Math.max(...flattened.map(n => n.y)) + nodeHeight + paddingY;

    return (
        <div className="relative w-full overflow-x-auto custom-scrollbar rounded-2xl bg-stone-50 border border-stone-200 backdrop-blur-sm">
            <div
                className="relative"
                style={{ width: paddingX + (maxLevel + 1) * colGap + nodeWidth, height: Math.max(500, maxRows) }}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>

                    {flattened.map((node) => (
                        <motion.path
                            key={`edge-${node.path}`}
                            d={`M ${node.parentPos!.x + nodeWidth} ${node.parentPos!.y} C ${node.parentPos!.x + nodeWidth + colGap / 2} ${node.parentPos!.y}, ${node.x - colGap / 2} ${node.y}, ${node.x} ${node.y}`}
                            fill="none"
                            stroke="url(#edge-gradient)"
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: node.level * 0.2 }}
                        />
                    ))}
                </svg>

                {/* Root Node */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute z-10 glass px-6 py-4 flex items-center gap-4 border border-primary/20 rounded-2xl bg-primary/10 shadow-sm"
                    style={{ left: rootX, top: rootY - nodeHeight / 2, width: nodeWidth }}
                >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-primary uppercase opacity-90">root</span>
                </motion.div>

                {/* Tree Nodes */}
                {flattened.map((node) => {
                    const fileUrl = `${repoUrl}/blob/main/${node.path}`;
                    return (
                        <motion.a
                            key={node.path}
                            href={node.type === 'file' ? fileUrl : undefined}
                            target={node.type === 'file' ? "_blank" : undefined}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: node.level * 0.1 }}
                            className={`absolute z-10 glass border border-stone-200 px-4 py-3 flex items-center gap-3 group hover:border-primary/50 hover:bg-stone-50 transition-all rounded-xl shadow-md ${node.type === 'file' ? 'cursor-pointer' : 'cursor-default'}`}
                            style={{ left: node.x, top: node.y - nodeHeight / 2, width: nodeWidth }}
                        >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                                node.type === 'dir' 
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' 
                                    : 'bg-stone-100 border-stone-200 text-stone-500 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary'
                            }`}>
                                {node.type === 'dir' ? (
                                    <Folder className="w-4 h-4" />
                                ) : (
                                    <FileText className="w-4 h-4" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-stone-800 truncate group-hover:text-stone-900 transition-colors">{node.name}</div>
                                {node.type === 'file' && (
                                    <div className="text-[9px] font-mono text-stone-400 uppercase tracking-widest flex items-center gap-1 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all">
                                        Link <ExternalLink className="w-2.5 h-2.5" />
                                    </div>
                                )}
                            </div>
                        </motion.a>
                    );
                })}
            </div>
        </div>
    );
}
