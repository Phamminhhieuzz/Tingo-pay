export class LinkZaloAccountDto {
  /** Zalo platform userId */
  zaloUserId: string;

  /** Mini App ID (optional) */
  appId?: string;
}

export class UnlinkZaloAccountDto {
  /** Zalo userId cần hủy; account Tingo được suy ra từ bearer V1. */
  zaloUserId?: string;
}
