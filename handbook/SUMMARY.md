# Summary

- [Preface](00-preface/README.md)

# Part I — Foundation
- [1. The Big Picture](part-01-foundation/ch01-the-big-picture.md)
- [2. Docker Review](part-01-foundation/ch02-docker-review.md)
- [3. Why Docker Compose Isn't Enough](part-01-foundation/ch03-why-docker-compose-isnt-enough.md)

# Part II — First Cluster
- [4. Kubernetes Architecture](part-02-first-cluster/ch04-kubernetes-architecture.md)
- [5. kubectl](part-02-first-cluster/ch05-kubectl.md)
- [6. Deploy Your First Pod](part-02-first-cluster/ch06-deploy-your-first-pod.md)
- [7. Deployment & ReplicaSet](part-02-first-cluster/ch07-deployment-and-replicaset.md)
- [8. Rolling Update & Rollback](part-02-first-cluster/ch08-rolling-update-and-rollback.md)
- [9. Service & DNS](part-02-first-cluster/ch09-service-and-dns.md)

# Part III — Making the Project Real
- [10. ConfigMap & Secret](part-03-making-the-project-real/ch10-configmap-and-secret.md)
- [11. Liveness, Readiness & Startup Probes](part-03-making-the-project-real/ch11-probes.md)
- [12. Resource Requests, Limits & QoS](part-03-making-the-project-real/ch12-resource-requests-limits-and-qos.md)
- [13. Scaling & HPA](part-03-making-the-project-real/ch13-scaling-and-hpa.md)
- [14. CronJob, Job, Worker & Queue](part-03-making-the-project-real/ch14-cronjob-job-worker-and-queue.md)
- [15. PVC, PV & StorageClass](part-03-making-the-project-real/ch15-pvc-pv-and-storageclass.md)
- [16. StatefulSet](part-03-making-the-project-real/ch16-statefulset.md)

# Part IV — Networking
- [17. Linux Networking Fundamentals](part-04-networking/ch17-linux-networking-fundamentals.md)
- [18. CNI](part-04-networking/ch18-cni.md)
- [19. CNI Plugins: Flannel, Calico, Cilium](part-04-networking/ch19-cni-plugins-flannel-calico-cilium.md)
- [20. Service Deep Dive](part-04-networking/ch20-service-deep-dive.md)
- [21. Ingress & Ingress Controller](part-04-networking/ch21-ingress-and-ingress-controller.md)
- [22. Gateway API](part-04-networking/ch22-gateway-api.md)

# Part V — Production
- [23. Monitoring: Prometheus & Grafana](part-05-production/ch23-monitoring-prometheus-grafana.md)
- [24. Logging: Loki & Fluent Bit](part-05-production/ch24-logging-loki-fluent-bit.md)
- [25. Tracing: OpenTelemetry, Jaeger & Tempo](part-05-production/ch25-tracing-opentelemetry-jaeger-tempo.md)
- [26. Debugging](part-05-production/ch26-debugging.md)
- [27. Autoscaling: HPA, VPA & KEDA](part-05-production/ch27-autoscaling-hpa-vpa-keda.md)
- [28. Affinity, Taints & Topology Spread](part-05-production/ch28-affinity-taints-and-topology-spread.md)

# Part VI — CI/CD
- [29. Docker Build & Registry](part-06-ci-cd/ch29-docker-build-and-registry.md)
- [30. GitHub Actions](part-06-ci-cd/ch30-github-actions.md)
- [31. Helm](part-06-ci-cd/ch31-helm.md)
- [32. Kustomize](part-06-ci-cd/ch32-kustomize.md)
- [33. GitOps & ArgoCD](part-06-ci-cd/ch33-gitops-and-argocd.md)
- [34. Progressive Delivery: Blue-Green & Canary](part-06-ci-cd/ch34-progressive-delivery.md)

# Part VII — Security
- [35. RBAC](part-07-security/ch35-rbac.md)
- [36. Network Policy](part-07-security/ch36-network-policy.md)
- [37. Pod Security](part-07-security/ch37-pod-security.md)
- [38. Secrets Management: Vault & External Secrets](part-07-security/ch38-secrets-management.md)
- [39. Image Security: SBOM, Cosign & Trivy](part-07-security/ch39-image-security.md)

# Part VIII — Multi-Cluster & Cloud
- [40. HA Control Plane](part-08-multi-cluster-and-cloud/ch40-ha-control-plane.md)
- [41. Disaster Recovery](part-08-multi-cluster-and-cloud/ch41-disaster-recovery.md)
- [42. Backup with Velero](part-08-multi-cluster-and-cloud/ch42-backup-with-velero.md)
- [43. Upgrading a Cluster](part-08-multi-cluster-and-cloud/ch43-upgrading-a-cluster.md)
- [44. EKS](part-08-multi-cluster-and-cloud/ch44-eks.md)
- [45. GKE](part-08-multi-cluster-and-cloud/ch45-gke.md)
- [46. AKS](part-08-multi-cluster-and-cloud/ch46-aks.md)

# Part IX — Platform Engineering
- [47. Helm Chart Design](part-09-platform-engineering/ch47-helm-chart-design.md)
- [48. Operators, CRDs & Kubebuilder](part-09-platform-engineering/ch48-operators-crd-and-kubebuilder.md)
- [49. Internal Developer Platform: Backstage & Crossplane](part-09-platform-engineering/ch49-internal-developer-platform.md)
- [50. Multi-Tenancy](part-09-platform-engineering/ch50-multi-tenancy.md)

# Part X — Under the Hood
- [51. How kubectl Works](part-10-under-the-hood/ch51-how-kubectl-works.md)
- [52. API Server Internals](part-10-under-the-hood/ch52-api-server-internals.md)
- [53. etcd: Raft, Watch & MVCC](part-10-under-the-hood/ch53-etcd-raft-watch-and-mvcc.md)
- [54. Scheduler Internals: Filter, Score, Bind](part-10-under-the-hood/ch54-scheduler-internals.md)
- [55. The Controller Pattern: Informer, Watcher, Work Queue](part-10-under-the-hood/ch55-controller-pattern.md)
- [56. Kubelet](part-10-under-the-hood/ch56-kubelet.md)
- [57. Container Runtime & CRI](part-10-under-the-hood/ch57-container-runtime-and-cri.md)
- [58. kube-proxy: iptables, IPVS & eBPF](part-10-under-the-hood/ch58-kube-proxy-iptables-ipvs-ebpf.md)
- [59. CSI](part-10-under-the-hood/ch59-csi.md)
- [60. CNI Internals](part-10-under-the-hood/ch60-cni-internals.md)
- [61. Admission Controllers](part-10-under-the-hood/ch61-admission-controllers.md)
- [62. Operator Runtime](part-10-under-the-hood/ch62-operator-runtime.md)
- [63. Building a Mini Kubernetes (in Go)](part-10-under-the-hood/ch63-building-mini-kubernetes.md)
