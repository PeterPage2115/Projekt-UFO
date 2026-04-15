/**
 * API route for alliances.
 * GET: List/search alliances with pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alliances } from '@/lib/db/schema';
import { like, desc, asc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const search = url.searchParams.get('search')?.trim();
    const sortBy = url.searchParams.get('sort') || 'totalPop';
    const order = url.searchParams.get('order') || 'desc';

    let query = db.select().from(alliances).$dynamic();

    const conditions = [];
    if (search) {
      conditions.push(like(alliances.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      for (const cond of conditions) {
        query = query.where(cond) as typeof query;
      }
    }

    const sortColumn = sortBy === 'name' ? alliances.name
      : sortBy === 'memberCount' ? alliances.memberCount
      : alliances.totalPop;
    const sortDir = order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const results = await query.orderBy(sortDir).limit(limit).offset(offset).all();

    let countQuery = db.select({ count: sql<number>`count(*)` }).from(alliances).$dynamic();
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
    console.error('[api/alliances] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch alliances' }, { status: 500 });
  }
}
