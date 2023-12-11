const allRoles = {
  owner: [],
  assistant: ['addMembers'],
  maker: [],
  photographer: [],
  shipper: [],
};

export enum MEMBER_ROLES {
  OWNER = 'owner',
  ASSISTANT = 'assistant',
  MAKER = 'maker',
  PHOTOGRAPHER = 'photographer',
  SHIPPER = 'shipper'
}

export const memberRoles = Object.values(MEMBER_ROLES);
export const roleRights = new Map<string, string[]>(Object.entries(allRoles));
