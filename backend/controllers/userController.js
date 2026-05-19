import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ENV } from '../config/env.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';

const cognito = new CognitoIdentityProviderClient({
  region: ENV.COGNITO_REGION,
  credentials: {
    accessKeyId:     ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

const POOL_ID = ENV.COGNITO_USER_POOL_ID;

// List all Cognito users with their current groups
export const listUsers = async (req, res) => {
  try {
    const { Users = [] } = await cognito.send(new ListUsersCommand({
      UserPoolId: POOL_ID,
      Limit: 60,
    }));

    const enriched = await Promise.all(Users.map(async (u) => {
      const { Groups = [] } = await cognito.send(new AdminListGroupsForUserCommand({
        UserPoolId: POOL_ID,
        Username:   u.Username,
      }));

      const attrs = Object.fromEntries(u.Attributes.map(a => [a.Name, a.Value]));

      return {
        username:  u.Username,
        sub:       attrs.sub,
        email:     attrs.email,
        name:      attrs.name,
        phone:     attrs.phone_number,
        status:    u.UserStatus,
        enabled:   u.Enabled,
        groups:    Groups.map(g => g.GroupName),
        role:      Groups[0]?.GroupName || 'customer',
        createdAt: u.UserCreateDate,
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign a role (group) to a user
export const assignRole = async (req, res) => {
  const { username, role } = req.body; // role: 'admin' | 'staff' | 'customer'
  const ROLES = ['admin', 'staff', 'customer'];

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const admin = await User.findOne({ cognitoSub: req.user.cognitoSub });

    // remove from all existing groups first
    const { Groups = [] } = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: POOL_ID,
      Username:   username,
    }));

    await Promise.all(Groups.map(g =>
      cognito.send(new AdminRemoveUserFromGroupCommand({
        UserPoolId: POOL_ID,
        Username:   username,
        GroupName:  g.GroupName,
      }))
    ));

    // add to new group
    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: POOL_ID,
      Username:   username,
      GroupName:  role,
    }));

    // update MongoDB role if staff/admin
    const { Users } = await cognito.send(new ListUsersCommand({
      UserPoolId: POOL_ID,
      Filter:     `username = "${username}"`,
    }));
    const attrs = Object.fromEntries((Users?.[0]?.Attributes || []).map(a => [a.Name, a.Value]));

    if (role === 'admin' || role === 'staff') {
      await User.findOneAndUpdate(
        { cognitoSub: attrs.sub },
        { role },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // remove from customers if they were one
      await Customer.deleteOne({ cognitoSub: attrs.sub });
    }

    await AuditLog.create({
      actor:       admin._id,
      action:      'ASSIGN_ROLE',
      targetModel: 'User',
      targetId:    admin._id,
      diff:        { after: { username, role } },
    });

    res.json({ message: `${username} assigned to ${role}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Disable a user account
export const disableUser = async (req, res) => {
  const { username } = req.params;
  try {
    await cognito.send(new AdminDisableUserCommand({ UserPoolId: POOL_ID, Username: username }));
    res.json({ message: 'User disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Enable a user account
export const enableUser = async (req, res) => {
  const { username } = req.params;
  try {
    await cognito.send(new AdminEnableUserCommand({ UserPoolId: POOL_ID, Username: username }));
    res.json({ message: 'User enabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
