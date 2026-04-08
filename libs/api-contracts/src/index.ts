import { z } from 'zod';

export const UserRoleSchema = z.enum(['CLIENT', 'PROVIDER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	nif: z.string().regex(/^\d{9}$/),
	role: UserRoleSchema,
	balance: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: AuthUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LoginInputSchema = z.object({
	identifier: z
		.string()
		.regex(/^(([^\s@]+@[^\s@]+\.[^\s@]+)|(\d{9}))$/),
	password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	nif: z.string().regex(/^\d{9}$/),
	password: z.string().min(8),
	role: UserRoleSchema,
	balance: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const ServiceSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	price: z.string(),
	ownerId: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	owner: AuthUserSchema.optional(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const PaginationMetaSchema = z.object({
	page: z.number(),
	pageSize: z.number(),
	total: z.number(),
	totalPages: z.number(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const PaginatedServicesSchema = z.object({
	items: z.array(ServiceSchema),
	meta: PaginationMetaSchema,
});
export type PaginatedServices = z.infer<typeof PaginatedServicesSchema>;

export const TransactionStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED']);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionTypeSchema = z.enum(['PURCHASE', 'REFUND']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
	id: z.string(),
	idempotencyKey: z.string(),
	amount: z.string(),
	status: TransactionStatusSchema,
	type: TransactionTypeSchema,
	createdAt: z.string(),
	service: ServiceSchema.pick({
		id: true,
		title: true,
		description: true,
		price: true,
		ownerId: true,
	}),
	client: AuthUserSchema,
	provider: AuthUserSchema,
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const PaginatedTransactionsSchema = z.object({
	items: z.array(TransactionSchema),
	meta: PaginationMetaSchema,
});
export type PaginatedTransactions = z.infer<typeof PaginatedTransactionsSchema>;

export const ApiErrorSchema = z.object({
	statusCode: z.number(),
	message: z.union([z.string(), z.array(z.string())]),
	error: z.string().optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
