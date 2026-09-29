import { UserRole } from '../../entities/user.entity';
import { sanitizeRequestedRole, pickTokenRole, syncOwnershipRoles } from './auth-roles';

describe('sanitizeRequestedRole', () => {
  it.each([UserRole.CUSTOMER, UserRole.SHOP_OWNER, UserRole.SHOP_MEMBER])(
    'giữ nguyên vai trò tự chọn hợp lệ %s',
    (role) => expect(sanitizeRequestedRole(role)).toBe(role),
  );

  it.each([UserRole.STAFF, UserRole.GUEST, 'ADMIN', '', undefined, null, 123])(
    'không bao giờ cấp %p, quay về CUSTOMER',
    (role) => expect(sanitizeRequestedRole(role as any)).toBe(UserRole.CUSTOMER),
  );
});

describe('pickTokenRole', () => {
  it('dùng vai trò được chọn nếu tài khoản thật sự có vai trò đó', () => {
    expect(pickTokenRole([UserRole.CUSTOMER, UserRole.SHOP_OWNER], UserRole.SHOP_OWNER)).toBe(UserRole.SHOP_OWNER);
  });

  it('bỏ qua vai trò được chọn nếu tài khoản không có (không leo thang STAFF)', () => {
    expect(pickTokenRole([UserRole.CUSTOMER], UserRole.STAFF)).toBe(UserRole.CUSTOMER);
  });

  it('không chọn gì thì lấy vai trò đầu tiên', () => {
    expect(pickTokenRole([UserRole.STAFF], undefined)).toBe(UserRole.STAFF);
  });
});

describe('syncOwnershipRoles', () => {
  it('sở hữu cửa hàng nhưng chưa có SHOP_OWNER: thêm SHOP_OWNER, bỏ CUSTOMER', () => {
    const roles = syncOwnershipRoles([UserRole.CUSTOMER], { ownsShop: true, isShopStaff: false });
    expect(roles).toEqual([UserRole.SHOP_OWNER]);
  });

  it('không còn sở hữu cửa hàng nào nhưng vẫn có SHOP_OWNER: bỏ SHOP_OWNER, thêm CUSTOMER', () => {
    const roles = syncOwnershipRoles([UserRole.SHOP_OWNER], { ownsShop: false, isShopStaff: false });
    expect(roles).toEqual([UserRole.CUSTOMER]);
  });

  it('là nhân viên 1 cửa hàng nhưng chưa có SHOP_MEMBER: thêm SHOP_MEMBER, bỏ CUSTOMER', () => {
    const roles = syncOwnershipRoles([UserRole.CUSTOMER], { ownsShop: false, isShopStaff: true });
    expect(roles).toEqual([UserRole.SHOP_MEMBER]);
  });

  it('không còn là nhân viên cửa hàng nào nhưng vẫn có SHOP_MEMBER: bỏ SHOP_MEMBER, thêm CUSTOMER', () => {
    const roles = syncOwnershipRoles([UserRole.SHOP_MEMBER], { ownsShop: false, isShopStaff: false });
    expect(roles).toEqual([UserRole.CUSTOMER]);
  });

  it('vừa sở hữu vừa là nhân viên cửa hàng khác: chỉ cần SHOP_OWNER (đã có quyền tương đương hoặc cao hơn)', () => {
    const roles = syncOwnershipRoles([UserRole.CUSTOMER], { ownsShop: true, isShopStaff: true });
    expect(roles).toEqual([UserRole.SHOP_OWNER]);
  });

  it('đã là SHOP_OWNER thì không tự thêm SHOP_MEMBER dù có trong shop_staff (owner không cần quyền thấp hơn)', () => {
    const roles = syncOwnershipRoles([UserRole.SHOP_OWNER], { ownsShop: true, isShopStaff: true });
    expect(roles).toEqual([UserRole.SHOP_OWNER]);
  });

  it('không bao giờ đụng tới STAFF', () => {
    const roles = syncOwnershipRoles([UserRole.STAFF], { ownsShop: false, isShopStaff: true });
    expect(roles).toEqual([UserRole.STAFF]);
  });

  it('không thay đổi gì thì trả về mảng có cùng nội dung (idempotent)', () => {
    const roles = syncOwnershipRoles([UserRole.SHOP_OWNER], { ownsShop: true, isShopStaff: false });
    expect(roles).toEqual([UserRole.SHOP_OWNER]);
  });
});
