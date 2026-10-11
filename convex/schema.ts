import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export const continent = v.union(v.literal('eu'),v.literal('af'),v.literal('as'),v.literal('na'),v.literal('sa'),v.literal('oc'));
export const mode = v.union(v.literal('quick'),v.literal('full'),v.literal('practice'));
export const answer = v.object({ countryId: v.string(), selectedId: v.union(v.string(),v.null()) });
export default defineSchema({
  games: defineTable({
    userId:v.string(), attemptId:v.string(), continent, mode, duration:v.number(), completedAt:v.number(),
    answers:v.array(answer), correct:v.number(), total:v.number(), percentage:v.number(),
  }).index('by_user', ['userId']).index('by_user_attempt',['userId','attemptId']),
});
