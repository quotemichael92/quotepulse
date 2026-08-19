import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', pb: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 10, color: '#64748b', marginTop: 4 },
  section: { marginVertical: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  text: { fontSize: 10, color: '#334155' },
  totalRow: { flexDirection: 'row', justify: 'space-between', marginTop: 15, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#0f172a' },
  totalText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  signatureBox: { marginTop: 25, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  signatureImage: { width: 180, height: 60, marginTop: 5 }
})

export default function QuotePdfTemplate({ quote, options, totalAmount, signatureData, clientNotes }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ricevuta Preventivo & Accordo di Lavoro</Text>
          <Text style={styles.subtitle}>ID Preventivo: {quote?.id || 'DEMO-123'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servizi Selezionati</Text>
          <View style={styles.row}>
            <Text style={styles.text}>Piattaforma Web & Configurazione Core</Text>
            <Text style={styles.text}>€1550</Text>
          </View>
          {options.map((opt: any, index: number) => (
            <View key={index} style={styles.row}>
              <Text style={styles.text}>{opt.title}</Text>
              <Text style={styles.text}>+€{opt.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Totale Confermato</Text>
          <Text style={styles.totalText}>€{totalAmount}</Text>
        </View>

        {clientNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note del Cliente</Text>
            <Text style={styles.text}>{clientNotes}</Text>
          </View>
        ) : null}

        <View style={styles.signatureBox}>
          <Text style={styles.sectionTitle}>Firma del Cliente</Text>
          {signatureData ? (
            <Image style={styles.signatureImage} src={signatureData} />
          ) : (
            <Text style={styles.text}>Firma Digitale Registrata</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}