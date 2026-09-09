import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";

const API_URL = process.env.EXPO_PRODUCAO_API_URL;

type Empresa = {
  cnpj?: string;
  CNPJ?: string;
  matriz_ou_filial?: string;
  razao_social?: string;
  razaoSocial?: string;
  nome_fantasia?: string;
  nomeFantasia?: string;
  situacao?: string;
  data_situacao?: string;
  natureza_juridica?: string;
  abertura?: string;
  cnae?: string | number;
  ramo_de_atividade?: string;
  tipo_logradouro?: string;
  logradouro?: string;
  numero?: string | number;
  complemento?: string;
  bairro?: string;
  cep?: string | number;
  uf?: string;
  municipio?: string;
  telefone1_completo?: string;
  telefone2_completo?: string;
  email?: string;
  capital_social?: string | number;
  porte?: string;
  simples_nacional?: string;
  mei?: string;
  socios?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCep(value?: string | number) {
  if (!value) return "-";
  const digits = onlyDigits(String(value)).padStart(8, "0");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : String(value);
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const [copied, setCopied] = useState(false);

  const displayValue =
    value === undefined || value === null || value === ""
      ? "-"
      : String(value);

  async function copiar() {
    if (displayValue === "-") return;

    await Clipboard.setStringAsync(displayValue);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.fieldValueRow}>
        <Text selectable style={styles.fieldValue}>
          {displayValue}
        </Text>

        {displayValue !== "-" ? (
          <Pressable
            onPress={copiar}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.copyButtonPressed,
            ]}
          >
            <Text style={styles.copyButtonText}>
              {copied ? "✓" : "📋"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {copied ? (
        <Text style={styles.copiedText}>Copiado!</Text>
      ) : null}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const digits = useMemo(() => onlyDigits(cnpj), [cnpj]);
  const canSearch = digits.length === 14;

  async function consultar() {
    Keyboard.dismiss();
    setErro("");
    setEmpresa(null);

    if (!canSearch) {
      setErro("Digite um CNPJ válido com 14 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/empresas/cnpj/${digits}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensagem || "Não foi possível realizar a consulta.");
      }

      setEmpresa(data);
    } catch (e: any) {
      setErro(
        e?.message?.includes("Network request failed")
          ? "Não foi possível conectar à API. Verifique o IP da máquina e se o backend está rodando na porta 3000."
          : e?.message || "Não foi possível realizar a consulta."
      );
    } finally {
      setLoading(false);
    }
  }

  function limpar() {
    setCnpj("");
    setEmpresa(null);
    setErro("");
  }

  const situacaoAtiva = String(empresa?.situacao || "").toUpperCase() === "ATIVA";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Rogério</Text>
            </View>
            <Text style={styles.brand}>Consulta CNPJ</Text>
          </View>
          <Text style={styles.headerTitle}>Consulte uma empresa</Text>
          <Text style={styles.headerSubtitle}>
            Informe o CNPJ para visualizar os dados cadastrais.
          </Text>
        </View>

        <View style={styles.main}>
          <View style={styles.searchCard}>
            <Text style={styles.inputLabel}>CNPJ</Text>

            <View style={[styles.inputWrapper, !!erro && styles.inputError]}>
              <Text style={styles.prefix}>CNPJ</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                maxLength={18}
                value={cnpj}
                onChangeText={(value) => {
                  setErro("");
                  setEmpresa(null);
                  setCnpj(formatCnpj(value));
                }}
                returnKeyType="search"
                onSubmitEditing={consultar}
              />
            </View>

            {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

            <Pressable
              onPress={consultar}
              disabled={loading}
              style={({ pressed }) => [
                styles.searchButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.searchIcon}>⌕</Text>
                  <Text style={styles.searchButtonText}>Consultar CNPJ</Text>
                </>
              )}
            </Pressable>

            {cnpj.length > 0 && !loading ? (
              <Pressable onPress={limpar} style={styles.clearButton}>
                <Text style={styles.clearText}>Limpar consulta</Text>
              </Pressable>
            ) : null}
          </View>

          {!empresa && !loading && !erro ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⌕</Text>
              </View>
              <Text style={styles.emptyTitle}>Nenhuma consulta realizada</Text>
              <Text style={styles.emptyText}>
                Digite um CNPJ acima e toque em “Consultar CNPJ” para começar.
              </Text>
            </View>
          ) : null}

          {empresa ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.companyIcon}>
                  <Text style={styles.companyIconText}>⌂</Text>
                </View>
                <View style={styles.companyHeaderText}>
                  <Text style={styles.resultLabel}>EMPRESA</Text>
                  <Text style={styles.companyName}>
                    {empresa.nome_fantasia || empresa.nomeFantasia || empresa.razao_social || empresa.razaoSocial || "Empresa consultada"}
                  </Text>
                  <Text style={styles.companyCnpj}>
                    {formatCnpj(String(empresa.cnpj || empresa.CNPJ || ""))}
                  </Text>
                </View>
                <View style={[styles.status, situacaoAtiva ? styles.statusActive : styles.statusOther]}>
                  <View style={[styles.statusDot, situacaoAtiva ? styles.statusDotActive : styles.statusDotOther]} />
                  <Text style={[styles.statusText, situacaoAtiva ? styles.statusTextActive : styles.statusTextOther]}>
                    {empresa.situacao || "NÃO INFORMADA"}
                  </Text>
                </View>
              </View>

              <Section title="Dados cadastrais">
                <Field label="Razão social" value={empresa.razao_social || empresa.razaoSocial} />
                <Field label="Nome fantasia" value={empresa.nome_fantasia || empresa.nomeFantasia} />
                <Field label="Matriz / filial" value={empresa.matriz_ou_filial} />
                <Field label="Data de abertura" value={empresa.abertura} />
                <Field label="Data da situação" value={empresa.data_situacao} />
                <Field label="Natureza jurídica" value={empresa.natureza_juridica} />
                <Field label="Porte" value={empresa.porte} />
              </Section>

              <Section title="Atividade econômica">
                <Field label="CNAE" value={empresa.cnae} />
                <Field label="Ramo de atividade" value={empresa.ramo_de_atividade} />
              </Section>

              <Section title="Endereço">
                <Field
                  label="Logradouro"
                  value={[
                    empresa.tipo_logradouro,
                    empresa.logradouro,
                    empresa.numero,
                    empresa.complemento,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Field label="Bairro" value={empresa.bairro} />
                <Field label="Município / UF" value={`${empresa.municipio || "-"} / ${empresa.uf || "-"}`} />
                <Field label="CEP" value={formatCep(empresa.cep)} />
              </Section>

              <Section title="Contato">
                <Field label="Telefone 1" value={empresa.telefone1_completo} />
                <Field label="Telefone 2" value={empresa.telefone2_completo} />
                <Field label="E-mail" value={empresa.email?.replace(/^&8206/, "")} />
              </Section>

              <Section title="Informações adicionais">
                <Field label="Capital social" value={empresa.capital_social} />
                <Field label="Simples Nacional" value={empresa.simples_nacional} />
                <Field label="MEI" value={empresa.mei} />
                <Field label="Sócios" value={empresa.socios} />
              </Section>
            </View>
          ) : null}
        </View>

       <Text style={styles.footer}>Criado por Rogerio Silva</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  header: {
    backgroundColor: "#123A63",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#123A63",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#D9E7F5",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 340,
  },
  main: {
    paddingHorizontal: 18,
    marginTop: -18,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  inputLabel: {
    color: "#344054",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#D92D20",
  },
  prefix: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "700",
    paddingLeft: 14,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#101828",
    fontSize: 17,
    paddingHorizontal: 8,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  searchButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1769AA",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  searchIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 24,
    marginRight: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  clearButton: {
    alignItems: "center",
    paddingTop: 13,
  },
  clearText: {
    color: "#1769AA",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 54,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8F1FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    color: "#1769AA",
    fontSize: 34,
    fontWeight: "700",
  },
  emptyTitle: {
    color: "#1D2939",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: "#667085",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 18,
    paddingBottom: 8,
    overflow: "hidden",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  resultHeader: {
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8F1FA",
    alignItems: "center",
    justifyContent: "center",
  },
  companyIconText: {
    color: "#1769AA",
    fontSize: 25,
  },
  companyHeaderText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  resultLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  companyName: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 3,
  },
  companyCnpj: {
    color: "#667085",
    fontSize: 12,
    marginTop: 4,
  },
  status: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 88,
  },
  statusActive: {
    backgroundColor: "#ECFDF3",
  },
  statusOther: {
    backgroundColor: "#FEF3F2",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotActive: {
    backgroundColor: "#12B76A",
  },
  statusDotOther: {
    backgroundColor: "#F04438",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  statusTextActive: {
    color: "#027A48",
  },
  statusTextOther: {
    color: "#B42318",
  },
  section: {
    paddingHorizontal: 18,
    paddingTop: 19,
  },
  sectionTitle: {
    color: "#123A63",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  field: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },

 fieldValueRow: {
   flexDirection: "row",
   alignItems: "center",
 },

 copyButton: {
   width: 34,
   height: 34,
   borderRadius: 8,
   alignItems: "center",
   justifyContent: "center",
   marginLeft: 8,
   backgroundColor: "#F2F4F7",
 },

 copyButtonPressed: {
   opacity: 0.6,
 },

 copyButtonText: {
   fontSize: 16,
 },

 copiedText: {
   color: "#027A48",
   fontSize: 11,
   fontWeight: "700",
   marginTop: 3,
 },
  fieldLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 3,
  },
  fieldValue: {
    color: "#1D2939",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    textAlign: "center",
    color: "#98A2B3",
    fontSize: 11,
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
