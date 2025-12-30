
  // create breadcrumb

  export const createBreadCrumb = (pathname) =>{
    const title = pathname.replace(/-/g, ' ').replace(/\//g, '')
    return title
}