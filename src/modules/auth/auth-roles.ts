import { UserRole } from '../../entities/user.entity';

// Vai trò người dùng được phép tự chọn khi đăng nhập/đăng ký. STAFF, GUEST không nằm trong
// danh sách: STAFF chỉ do Tingo gán trong CSDL, nếu cho client tự chọn thì ai cũng thành nhân viên.
const SELF_SERVICE_ROLES: UserRole[] = [UserRole.CUSTOMER, UserRole.SHOP_OWNER, UserRole.SHOP_MEMBER];

export const sanitizeRequestedRole = (requested: unknown): UserRole =>
  SELF_SERVICE_ROLES.includes(requested as UserRole) ? (requested as UserRole) : UserRole.CUSTOMER;

// Vai trò ghi vào JWT: chỉ dùng vai trò client chọn nếu tài khoản thật sự có vai trò đó
export const pickTokenRole = (userRoles: UserRole[], selected?: UserRole): UserRole =>
  selected && userRoles.includes(selected) ? selected : userRoles[0];

export interface OwnershipFacts {
  ownsShop: boolean;
  isShopStaff: boolean;
}

// Đồng bộ vai trò theo thực tế sở hữu/làm nhân viên cửa hàng, gọi mỗi lần đăng nhập.
// Không bao giờ thêm/bớt STAFF (chỉ Tingo gán trong CSDL); SHOP_OWNER không cần thêm SHOP_MEMBER
// vì mọi API đã cho phép cả 2 vai trò như nhau.
export const syncOwnershipRoles = (currentRoles: UserRole[], facts: OwnershipFacts): UserRole[] => {
  let roles = [...currentRoles];

  if (facts.ownsShop && !roles.includes(UserRole.SHOP_OWNER)) {
    roles = roles.filter((r) => r !== UserRole.CUSTOMER);
    roles.push(UserRole.SHOP_OWNER);
  } else if (!facts.ownsShop && roles.includes(UserRole.SHOP_OWNER)) {
    roles = roles.filter((r) => r !== UserRole.SHOP_OWNER);
    if (!roles.includes(UserRole.CUSTOMER)) roles.push(UserRole.CUSTOMER);
  }

  const hasHigherAccess = roles.includes(UserRole.SHOP_OWNER) || roles.includes(UserRole.STAFF);
  if (facts.isShopStaff && !hasHigherAccess && !roles.includes(UserRole.SHOP_MEMBER)) {
    roles = roles.filter((r) => r !== UserRole.CUSTOMER);
    roles.push(UserRole.SHOP_MEMBER);
  } else if (!facts.isShopStaff && roles.includes(UserRole.SHOP_MEMBER)) {
    roles = roles.filter((r) => r !== UserRole.SHOP_MEMBER);
    if (!roles.includes(UserRole.CUSTOMER)) roles.push(UserRole.CUSTOMER);
  }

  return roles;
};
