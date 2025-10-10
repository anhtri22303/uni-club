declare module "qrcode" {
  const qrcode: {
    toDataURL(data: string, options?: any): Promise<string>
    toCanvas(...args: any[]): any
    toString(...args: any[]): any
  }
  export default qrcode
}
