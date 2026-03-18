export const algorithmNotes = {
  astar: {
    title: 'A* (A Star)',
    content: `
    A* là thuật toán tìm đường rất phổ biến trong game và AI.
    
    Nó kết hợp:
    - Chi phí đã đi từ start (g)
    - Ước lượng khoảng cách tới goal (h)
    
    f(n) = g(n) + h(n)
    
    Nhờ heuristic này, A* thường tìm đường nhanh hơn BFS và Dijkstra.
    `,
    complexity: `
    Time Complexity: O(E log V)
    
    Ưu điểm:
    - Tìm đường nhanh
    - Phù hợp cho game
    
    Nhược điểm:
    - Phụ thuộc heuristic
    `,
  },

  bfs: {
    title: 'Breadth First Search (BFS)',
    content: `
    BFS duyệt đồ thị theo từng lớp.
    
    Thuật toán sử dụng Queue:
    - Bắt đầu từ start
    - Mở rộng tất cả node lân cận
    - Sau đó tiếp tục lan rộng
    
    Nếu mọi cạnh có trọng số bằng nhau,
    BFS luôn tìm được đường ngắn nhất.
    `,
    complexity: `
    Time Complexity: O(V + E)
    
    Ưu điểm:
    - Đơn giản
    - Luôn tìm shortest path khi cost bằng nhau
    
    Nhược điểm:
    - Khám phá nhiều node không cần thiết
    `,
  },

  dijkstra: {
    title: 'Dijkstra',
    content: `
    Dijkstra là thuật toán tìm đường ngắn nhất
    trong đồ thị có trọng số dương.
    
    Thuật toán luôn chọn node có chi phí thấp nhất
    để mở rộng tiếp theo.
    
    Nó giống BFS nhưng sử dụng priority queue.
    `,
    complexity: `
    Time Complexity: O(E log V)
    
    Ưu điểm:
    - Chính xác cho weighted graph
    
    Nhược điểm:
    - Chậm hơn A* nếu có heuristic tốt
    `,
  },

  dfs: {
    title: 'Depth-First Search (DFS)',
    content: `
    DFS duyệt đồ thị theo chiều sâu.
    
    Thuật toán sử dụng Stack:
    - Bắt đầu từ start
    - Đi sâu vào một nhánh trước
    - Backtrack khi hết đường
    
    Không đảm bảo tìm đường ngắn nhất.
    `,
    complexity: `
    Time Complexity: O(V + E)
    
    Ưu điểm:
    - Đơn giản
    - Ít bộ nhớ hơn BFS nếu dùng đệ quy
    
    Nhược điểm:
    - Không tìm shortest path
    `,
  },

  prim: {
    title: "Prim's Algorithm",
    content: `
    Thuật toán Prim xây dựng cây khung nhỏ nhất (MST).
    
    Bắt đầu từ start, mỗi bước thêm node có chi phí cạnh
    nhỏ nhất nối với cây hiện tại.
    
    Trên lưới với cost đều (=1), thứ tự có thể khác Dijkstra.
    `,
    complexity: `
    Time Complexity: O(V²) hoặc O(E log V) với heap
    
    Ưu điểm:
    - Xây dựng MST
    - Đơn giản
    
    Nhược điểm:
    - Không tối ưu cho tìm đường đơn
    `,
  },

  greedy: {
    title: 'Greedy Best-First Search',
    content: `
    Greedy chỉ dùng heuristic h(n) để chọn node tiếp theo,
    bỏ qua chi phí đã đi g(n).
    
    Luôn chọn node gần goal nhất (theo ước lượng).
    
    Nhanh nhưng có thể không tìm được đường ngắn nhất.
    `,
    complexity: `
    Time Complexity: O(E log V)
    
    Ưu điểm:
    - Rất nhanh
    - Đơn giản
    
    Nhược điểm:
    - Không đảm bảo đường ngắn nhất
    `,
  },
}
