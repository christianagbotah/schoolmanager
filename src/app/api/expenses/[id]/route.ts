import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const expense = await db.expense.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        description: body.description,
        category_id: body.categoryId ? parseInt(body.categoryId) : null,
        amount: parseFloat(body.amount),
        expense_date: body.expenseDate ? new Date(body.expenseDate) : undefined,
        payment_method: body.paymentMethod,
        status: body.status,
      },
    });
    return NextResponse.json({ expense, message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.expense.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
