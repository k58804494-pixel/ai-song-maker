/**
 * Memory Graph Engine
 * Stores bugs, fixes, architecture decisions, user preferences, workflows
 * Functions as a connected graph: Bug → Cause → Fix → Outcome → Future Prevention
 */

export class MemoryGraphEngine {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.index = {
      byType: new Map(),
      byTag: new Map(),
      byTimestamp: []
    };
    this.nodeCount = 0;
  }

  /**
   * Store a new node in the memory graph
   */
  async store(data) {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    const node = {
      id,
      ...data,
      timestamp,
      connections: [],
      metadata: {
        version: '1.0',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    this.nodes.set(id, node);
    this.nodeCount++;

    // Index by type
    if (data.type) {
      if (!this.index.byType.has(data.type)) {
        this.index.byType.set(data.type, []);
      }
      this.index.byType.get(data.type).push(id);
    }

    // Index by timestamp
    this.index.byTimestamp.push({ id, timestamp });

    console.log('💾 Stored memory node:', id, '(' + data.type + ')');

    return node;
  }

  /**
   * Create a connection between two nodes
   */
  connect(fromId, toId, relationship) {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error('Cannot connect non-existent nodes');
    }

    const edge = {
      id: this.generateId(),
      from: fromId,
      to: toId,
      relationship,
      timestamp: new Date().toISOString()
    };

    this.edges.push(edge);

    // Update node connections
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    
    fromNode.connections.push({ to: toId, relationship });
    toNode.connections.push({ from: fromId, relationship: this.reverseRelationship(relationship) });

    return edge;
  }

  /**
   * Query the memory graph
   */
  query(filters) {
    let results = Array.from(this.nodes.values());

    // Filter by type
    if (filters.type) {
      results = results.filter(n => n.type === filters.type);
    }

    // Filter by tags
    if (filters.tags && Array.isArray(filters.tags)) {
      results = results.filter(n => 
        n.tags && filters.tags.some(t => n.tags.includes(t))
      );
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      results = results.filter(n => {
        const ts = new Date(n.timestamp);
        if (filters.startDate && ts < new Date(filters.startDate)) return false;
        if (filters.endDate && ts > new Date(filters.endDate)) return false;
        return true;
      });
    }

    return results;
  }

  /**
   * Find related nodes (graph traversal)
   */
  findRelated(nodeId, depth = 2) {
    if (!this.nodes.has(nodeId)) {
      return [];
    }

    const visited = new Set();
    const related = [];
    const queue = [{ id: nodeId, depth: 0 }];

    while (queue.length > 0 && depth > 0) {
      const current = queue.shift();
      
      if (current.depth >= depth) continue;
      if (visited.has(current.id)) continue;
      
      visited.add(current.id);

      const node = this.nodes.get(current.id);
      if (node && current.id !== nodeId) {
        related.push(node);
      }

      // Find connected nodes
      for (const edge of this.edges) {
        if (edge.from === current.id && !visited.has(edge.to)) {
          queue.push({ id: edge.to, depth: current.depth + 1 });
        }
        if (edge.to === current.id && !visited.has(edge.from)) {
          queue.push({ id: edge.from, depth: current.depth + 1 });
        }
      }
    }

    return related;
  }

  /**
   * Get learning chain for a bug/fix pattern
   */
  getLearningChain(bugId) {
    const chain = {
      bug: null,
      cause: null,
      fix: null,
      outcome: null,
      prevention: null
    };

    let currentNode = this.nodes.get(bugId);
    if (!currentNode) return chain;

    chain.bug = currentNode;

    // Traverse connections to build chain
    for (const conn of currentNode.connections) {
      if (conn.relationship === 'caused_by') {
        chain.cause = this.nodes.get(conn.to);
      } else if (conn.relationship === 'fixed_by') {
        chain.fix = this.nodes.get(conn.to);
      }
    }

    if (chain.fix) {
      for (const conn of chain.fix.connections) {
        if (conn.relationship === 'resulted_in') {
          chain.outcome = this.nodes.get(conn.to);
        } else if (conn.relationship === 'prevents') {
          chain.prevention = this.nodes.get(conn.to);
        }
      }
    }

    return chain;
  }

  /**
   * Get node count
   */
  getNodeCount() {
    return this.nodeCount;
  }

  /**
   * Persist memory to storage (placeholder for actual persistence)
   */
  async persist() {
    console.log('💾 Persisting ' + this.nodeCount + ' memory nodes...');
    // In production, this would write to disk or database
    return true;
  }

  /**
   * Load memory from storage (placeholder for actual loading)
   */
  async load() {
    console.log('📂 Loading memory graph...');
    // In production, this would read from disk or database
    return true;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Reverse relationship for bidirectional connections
   */
  reverseRelationship(rel) {
    const reverses = {
      'caused_by': 'causes',
      'fixed_by': 'fixes',
      'resulted_in': 'resulted_from',
      'prevents': 'prevented_by',
      'related_to': 'related_to'
    };
    return reverses[rel] || rel;
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const byType = {};
    for (const [type, ids] of this.index.byType) {
      byType[type] = ids.length;
    }

    return {
      totalNodes: this.nodeCount,
      totalEdges: this.edges.length,
      byType,
      oldestNode: this.index.byTimestamp[0]?.timestamp || null,
      newestNode: this.index.byTimestamp[this.index.byTimestamp.length - 1]?.timestamp || null
    };
  }
}
