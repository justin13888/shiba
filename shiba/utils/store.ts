export const [tabCount, {refetch: tabCountRefetch}] = createResource(getTabCount);

/**
 * Refresh global data
 */
export const dataRefetch = () => {
    tabCountRefetch();
}
