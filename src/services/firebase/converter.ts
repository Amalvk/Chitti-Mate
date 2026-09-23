import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore'

/** Generic converter that stores plain data as-is and stitches the doc id back on read. */
export function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T) {
      const { id: _id, ...rest } = model
      return rest
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T
    },
  }
}
