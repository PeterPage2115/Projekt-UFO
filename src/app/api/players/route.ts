/**
 * API route for players.
 * GET: List/search players with pagination and filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { like, eq, desc, asc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const search = url.searchParams.get('search')?.trim();
    const aid = url.searchParams.get('aid');
    const tid = url.searchParams.get('tid');
    const sortBy = url.searchParams.get('sort') || 'totalPop';
    const order = url.searchParams.get('order') || 'desc';

    let query = db.select().from(players).$dynamic();

    // Filters
    const conditions = [];
    if (search) {
      conditions.push(like(players.name, `%${search}%`));
    }
    if (aid) {
      conditions.push(eq(players.aid, parseInt(aid, 10)));
    }
    if (tid) {
      conditions.push(eq(players.tid, parseInt(tid, 10)));
    }

    if (conditions.length > 0) {
      for (const cond of conditions) {
        query = query.where(cond) as typeof query;
      }
    }

    // Sorting
    const sortColumn = sortBy === 'name' ? players.name
      : sortBy === 'villageCount' ? players.villageCount
      : sortBy === 'aid' ? players.aid
      : players.totalPop;
    const sortDir = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const results = await query.orderBy(sortDir).limit(limit).offset(offset).all();

    // Count total
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(players).$dynamic();
    if (conditions.length > 0) {
      for (const cond of conditions) {
        countQuery = countQuery.where(cond) as typeof countQuery;
      }
    }
    const totalResult = countQuery.get();
    const total = totalResult?.count || 0;

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[api/players] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
