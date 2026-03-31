export const algorithmCode = {
  astar: `
    function AStar(start, end):
    
      openSet = [start]
    
      while openSet not empty:
    
        current = node with lowest f
    
        if current == end:
            return path
    
        for neighbor in neighbors:
    
            tempG = g[current] + 1
    
            if tempG < g[neighbor]:
    
                parent[neighbor] = current
                g[neighbor] = tempG
                f[neighbor] = g + heuristic
    `,

  bfs: `
    function BFS(start):
    
      queue = [start]
    
      while queue not empty:
    
        current = queue.pop()
    
        for neighbor in neighbors:
    
          if neighbor not visited:
    
            visited.add(neighbor)
            parent[neighbor] = current
            queue.push(neighbor)
    `,

  dijkstra: `
    function Dijkstra(start):
    
      distance[start] = 0
    
      while nodes remain:
    
        current = node with lowest distance
    
        for neighbor in neighbors:
    
          newCost = distance[current] + 1
    
          if newCost < distance[neighbor]:
    
            distance[neighbor] = newCost
            parent[neighbor] = current
    `,

  dfs: `
    function DFS(start):
    
      stack = [start]
    
      while stack not empty:
    
        current = stack.pop()
    
        if current == end:
            return path
    
        for neighbor in neighbors:
    
          if neighbor not visited:
    
            visited.add(neighbor)
            parent[neighbor] = current
            stack.push(neighbor)
    `,

  prim: `
    function Prim(start):
    
      cost[start] = 0
    
      while nodes not in tree:
    
        current = node with lowest cost (not in tree)
    
        add current to tree
    
        if current == end:
            return path
    
        for neighbor in neighbors:
    
          if neighbor not in tree:
    
            if edgeCost < cost[neighbor]:
    
                cost[neighbor] = edgeCost
                parent[neighbor] = current
    `,

  greedy: `
    function Greedy(start, end):
    
      openSet = [start]
    
      while openSet not empty:
    
        current = node with lowest h (heuristic to end)
    
        if current == end:
            return path
    
        for neighbor in neighbors:
    
            if neighbor not in openSet:
    
                parent[neighbor] = current
                openSet.push(neighbor)
    `,
}
