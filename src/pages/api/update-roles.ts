
import { NextApiRequest, NextApiResponse } from 'next';
import { rbacService } from '@/services/rbacService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Update roles to include new roles
    await rbacService.updateRoles();
    
    return res.status(200).json({ message: 'Roles updated successfully' });
  } catch (error) {
    console.error('Error updating roles:', error);
    return res.status(500).json({ message: 'Error updating roles', error });
  }
}
