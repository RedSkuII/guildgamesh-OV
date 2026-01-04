import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageGuildResources, canUpdateGuildResources, canAccessGuild } from '@/lib/guild-access'
import { hasResourceAdminAccess, isDiscordServerOwner } from '@/lib/discord-roles'
import { db, guilds } from '@/lib/db'
import { eq } from 'drizzle-orm'

/**
 * GET /api/guilds/[guildId]/permissions
 * Returns the current user's permissions for a specific guild
 * 
 * Permission levels:
 * - canUpdateResources: Any guild member (member, officer, leader) can update quantities
 * - canManageResources: Leaders and officers can create/edit metadata/delete resources
 * - canEditTargets: Global admins and target editors can edit target quantities
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const guildId = params.guildId
    const userRoles = session.user.roles || []
    
    // Check if super admin
    const superAdminUserId = process.env.SUPER_ADMIN_USER_ID
    const isSuperAdmin = superAdminUserId && session.user.id === superAdminUserId
    
    if (isSuperAdmin) {
      return NextResponse.json({
        canUpdateResources: true,
        canManageResources: true,
        canEditTargets: true,
        isLeader: true,
        isOfficer: true,
        isMember: true,
        reason: 'Super admin access'
      })
    }
    
    // Get guild info to check Discord server ownership
    const guildData = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1)
    
    if (guildData.length === 0) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
    }
    
    const guild = guildData[0]
    const discordServerId = guild.discordGuildId
    
    // Check if user owns this Discord server
    const isOwner = isDiscordServerOwner(session, discordServerId)
    
    // Check global admin access
    const hasGlobalAdmin = hasResourceAdminAccess(userRoles, isOwner)
    
    // Check guild-specific permissions
    const canUpdate = await canUpdateGuildResources(guildId, userRoles, hasGlobalAdmin)
    const canManage = await canManageGuildResources(guildId, userRoles, hasGlobalAdmin)
    
    // Target editing requires global admin or target edit permission
    const canEditTargets = hasGlobalAdmin || session.user.permissions?.hasTargetEditAccess
    
    // Determine role type for UI display
    const isLeader = guild.discordLeaderRoleId ? userRoles.includes(guild.discordLeaderRoleId) : false
    const isOfficer = guild.discordOfficerRoleId ? userRoles.includes(guild.discordOfficerRoleId) : false
    const isMember = guild.discordRoleId ? userRoles.includes(guild.discordRoleId) : false
    
    console.log(`[PERMISSIONS API] User ${session.user.id} for guild ${guild.title}:`)
    console.log(`  - isLeader: ${isLeader}, isOfficer: ${isOfficer}, isMember: ${isMember}`)
    console.log(`  - hasGlobalAdmin: ${hasGlobalAdmin}, isOwner: ${isOwner}`)
    console.log(`  - canUpdateResources: ${canUpdate}, canManageResources: ${canManage}`)
    
    return NextResponse.json({
      canUpdateResources: canUpdate,
      canManageResources: canManage,
      canEditTargets,
      isLeader,
      isOfficer,
      isMember,
      hasGlobalAdmin,
      isServerOwner: isOwner
    })
  } catch (error) {
    console.error('[PERMISSIONS API] Error:', error)
    return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
  }
}
