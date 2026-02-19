// CSS side-effect imports için tip tanımı
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
